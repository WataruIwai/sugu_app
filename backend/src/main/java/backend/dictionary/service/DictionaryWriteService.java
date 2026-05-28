package backend.dictionary.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import backend.dictionary.dto.WordEntry;
import backend.dictionary.repository.DictionaryRepository;

@Service
public class DictionaryWriteService {
    private DictionaryRepository dictionaryRepository;

    public DictionaryWriteService(DictionaryRepository dictionaryRepository) {
        this.dictionaryRepository = dictionaryRepository;
    }

    @Transactional
    public void createWordDataWithEntries(String normalized, List<WordEntry> entries) {
        long id = dictionaryRepository.createWordData(normalized);
        dictionaryRepository.createEntriesData(id, entries);
    }
}
